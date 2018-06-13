let React = require('react'),
    SegmentStore = require('../../stores/SegmentStore'),
    SegmentActions = require('../../actions/SegmentActions'),
    SegmentConstants = require('../../constants/SegmentConstants');

class FileNavigationMenu extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            initDropdown: true
        };
        this.dropDown = null;
        this.pname = null;
    }

    componentDidMount() {
    }

    componentWillUnmount() {
    }

    componentDidMount() {
        if(this.state.initDropdown){
            $(this.dropDown)
                .dropdown({
                    action: 'hide'
                });

            APP.fitText($(this.dropDown), $(this.pname),30);
            this.setState({
                initDropdown: false
            });
        }

    }

    goToCurrentSegment() {
        let currentSegment = SegmentStore.getCurrentSegment();
        setTimeout(()=>{SegmentActions.scrollToSegment(currentSegment.sid, currentSegment.fid)},0)

        $(this.dropDown).dropdown('toggle');
    }
    goToFile(index){
        UI.renderAndScrollToSegment(config.firstSegmentOfFiles[index].first_segment);
    }

    render() {
        const files = [];
        _.forEach(config.firstSegmentOfFiles, (item, index) => {
            const fileClass = UI.getIconClass(item.file_name.split('.')[item.file_name.split('.').length - 1]);
            let name;
            if(item.file_name.split('').length>40){
                name = item.file_name.substring(0,20).concat("[...]" ).concat((item.file_name).substring(item.file_name.length-20));
            }else{
                name = item.file_name;
            }

            const file = <div className="item" key={index} onClick={this.goToFile.bind(this,index)} title={item.file_name}>
                <i className={fileClass}></i>
                <p>{name}</p>
            </div>;
            files.push(file);
        });


        return <div id="fileNavigationMenu">
            <div className="ui dropdown button" ref={(ref) => this.dropDown = ref}>
                <span className="text"  ref={(ref) => this.pname = ref}>
                    {this.props.project_name}
                </span>
                <div className="menu">
                    <div className="header" onClick={this.goToCurrentSegment.bind(this)}>
                        Go to current segment
                    </div>
                    <div className="divider"></div>
                    {files}
                </div>
            </div>
            <p>({this.props.job_id}) &gt; <b>{this.props.source_rfc}</b> &gt;
                <b>{this.props.target_rfc}</b></p>
        </div>
    }
}

export default FileNavigationMenu;