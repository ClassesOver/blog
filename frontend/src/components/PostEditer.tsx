import React, {useEffect, useRef, useContext, useState} from "react";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-markdown";
import "ace-builds/src-noconflict/theme-gruvbox";
import MarkdownPreview from "./MarkdownPreview";
import {useHistory, useParams} from "react-router-dom";
import * as api from "../api";
import Button from '@material-ui/core/Button';
import Markdown from 'markdown-to-jsx';
import AppContext from '../context';
import {useToasts } from 'react-toast-notifications';

interface IPostEditorProps {
    body: string;
    onChange: (value: string, event?: any) => void;
};
interface IParams {
    postId: any;
}
interface IPostEditorViewProps {

}
interface IPostEditorHeaderProps {
    disabled?: boolean;
    mode: string;
    title: string;
    published: boolean;
    onSave: React.MouseEventHandler;
    onDraft: React.MouseEventHandler;
    onPublish: React.MouseEventHandler;
}

const PostEditor : React.FC<IPostEditorProps> = (props) => {
    return (<div className="tm-post-editor">
        <div className="editor-pane">
            <AceEditor  className="tm-ace-editor"
                        style = {
                            {
                                width: '50vw',
                                height: 'auto'
                            }
                        }
                        mode="markdown"
                        theme="gruvbox"
                        value={props.body}
                        onChange={props.onChange}
                        name="tm-ace-markdown-editor"
                        editorProps={{$blockScrolling: true }}
                        />
        </div>
        <div className="view-pane">
            <MarkdownPreview style = {
                            {
                                width: '50vw',
                                height: 'auto'
                            }
                        } className="markdown-body tm-mk-preview" value={props.body} />
        </div>
    </div>)
}

const PostEditorHeader : React.FC<IPostEditorHeaderProps>  = (props) => {
    console.log(props);
    return ( <div className="tm-post-editor-header">
        <div id="title"><Markdown>{props.title || ''}</Markdown></div>
        {props.mode == 'write' ? props.published ? <Button variant="contained" color="primary" onClick={props.onDraft} >Draft</Button> : <Button variant="contained" color="primary" onClick={props.onPublish} >Publish</Button> : ''}
        <Button variant="contained" color="secondary" onClick={props.onSave} disabled={props.disabled} >Save</Button>
    </div>)
}
interface IState {
    body: string;
    id: string | number;
    title: string;
    published: boolean;
}
const PostEditorView : React.FC<IPostEditorViewProps> = (props) => {
    const [post, setPost] = useState<IState>({body: '', title: '', id: 'new', published: false});
    const [disabled,setDisabled] = useState(true);
    const [values, setValues] = useState<any []>([]);
    const {authenticated} = useContext(AppContext);
    const [mode, setMode] = useState('');
    const history = useHistory();
    const { addToast } = useToasts();

    const onSave = (event: React.MouseEvent) => {
        if (postId === 'new') {
            createPost(post.body, post.title).then(id => {
                history.push(`/expore/editor/${id}`);
            });
        } else {
            savePost(postId, post.body, post.title).then(() => {
                fetchPost(postId);
            });
        }
    }
    const onPublish = async (event: React.MouseEvent) => {
        await api.publishPost(postId);
        setPost({...post, published: true});
        addToast(`${post.title} is published.`, {
            appearance: 'info',
            autoDismiss: true,
        })
    }
    const onDraft = async (event: React.MouseEvent) => {
        await api.draftPost(postId);
        setPost({...post, published: false});
        addToast(`${post.title} is drafted.`, {
            appearance: 'info',
            autoDismiss: true,
        })
    }
    let regexHeader = /^# (.*$)/igm;
    const onChange = (value: any) => {
        setDisabled(value == values.slice(-1));
        let header;
        if (value) {
            let headers = value.match(regexHeader);
            if (headers) {
                header = headers[0] || '';
                header = header.slice(2);
            } else {
                header = '';
            }
        } 
        return setPost({...post, body: value, title: header});
    }
    let { postId } = useParams<IParams>();
    const fetchPost = async (postId: string) => {
        if (postId === 'new') {
            setPost({...post, id: 'new', body: '', published: false})
            values.push('');
            setValues(values);
            setMode('create');
        } else {
            let resp = await api.getPost(postId);
            setDisabled(true);
            let {id, body, title, author, published} = resp.data as any;
            values.push(body);
            setValues(values);
            if (id && author.id !== authenticated.userId) {
                history.push('/expore', {errorCode: 401});
                return;
            }
            setPost({...post, id: id , body: body, title , published})
            setMode('write');
        }
    }

    
    useEffect(() => {
        fetchPost(postId)
    }, [props]);
    
    return (
        <>
        <PostEditorHeader published={post.published} mode={mode} title={post.title} disabled={disabled}  onDraft={onDraft} onPublish={onPublish} onSave={onSave}/>
        <PostEditor body={post.body} onChange={onChange} />
        </>
     )

}


const canBeDiscard = () => {
};


const createPost = async (body: string, title: string) => {
    let resp = await api.createPost({body, title});
    return resp.data;
}

const savePost = async (id: string, body: string, title: string) => {
    let resp = await api.updatePost(id, {body, title});
    return resp.data;
}



export default PostEditorView